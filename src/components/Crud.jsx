'use client';

import {
    App,
    Button,
    Flex,
    Form,
    Input,
    Modal,
    Popconfirm,
    Select,
    Space,
    Table,
} from 'antd';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Crud({
    titulo,
    colunas,
    campos,
    registros,
    salvar,
    excluir,
    busca,
}) {
    const [form] = Form.useForm();
    const [aberto, setAberto] = useState(false);
    const [processando, setProcessando] = useState(false);
    const [termo, setTermo] = useState(busca ?? '');
    const router = useRouter();
    const { message } = App.useApp();

    useEffect(() => {
        setTermo(busca ?? '');
    }, [busca]);

    function abrir(registro = {}) {
        form.resetFields();
        form.setFieldsValue(registro);
        setAberto(true);
    }

    async function executar(acao, dados) {
        setProcessando(true);
        try {
            const resposta = await acao(dados);
            if (resposta?.erro) {
                message.error(resposta.erro);
                return;
            }
            message.success('Operação realizada');
            setAberto(false);
        } catch {
            message.error(
                'Não foi possível concluir a operação. Tente novamente.',
            );
        } finally {
            setProcessando(false);
        }
    }

    const acoes = {
        title: 'Ações',
        key: 'acoes',
        render: (_, registro) => (
            <Space>
                <Button
                    size="small"
                    disabled={processando}
                    onClick={() => abrir(registro)}
                >
                    Editar
                </Button>
                <Popconfirm
                    title="Excluir este registro?"
                    onConfirm={() => executar(excluir, registro.id)}
                >
                    <Button size="small" danger disabled={processando}>
                        Excluir
                    </Button>
                </Popconfirm>
            </Space>
        ),
    };

    return (
        <Flex vertical gap={16}>
            <Flex justify="space-between" align="center" wrap gap={16}>
                <h1>{titulo}</h1>
                <Button
                    type="primary"
                    disabled={processando}
                    onClick={() => abrir()}
                >
                    Novo
                </Button>
            </Flex>

            {busca !== undefined && (
                <Input.Search
                    value={termo}
                    placeholder="Buscar por nome ou CPF"
                    enterButton="Buscar"
                    allowClear
                    onChange={(evento) => setTermo(evento.target.value)}
                    onSearch={(termo) =>
                        router.push(`?busca=${encodeURIComponent(termo)}`)
                    }
                />
            )}

            <Table
                rowKey="id"
                columns={[...colunas, acoes]}
                dataSource={registros}
                scroll={{ x: true }}
            />

            <Modal
                title={titulo}
                open={aberto}
                onCancel={() => !processando && setAberto(false)}
                onOk={form.submit}
                confirmLoading={processando}
                closable={!processando}
                maskClosable={!processando}
                okText="Salvar"
                cancelText="Cancelar"
                forceRender
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={(dados) => executar(salvar, dados)}
                >
                    <Form.Item name="id" hidden>
                        <Input />
                    </Form.Item>
                    {campos.map(({ name, label, opcoes, tipo, opcional }) => (
                        <Form.Item
                            key={name}
                            name={name}
                            label={label}
                            rules={[
                                {
                                    required: !opcional,
                                    message: 'Campo obrigatório',
                                },
                            ]}
                            normalize={(valor) => valor || null}
                        >
                            {opcoes ? (
                                <Select options={opcoes} />
                            ) : (
                                <Input type={tipo} />
                            )}
                        </Form.Item>
                    ))}
                </Form>
            </Modal>
        </Flex>
    );
}