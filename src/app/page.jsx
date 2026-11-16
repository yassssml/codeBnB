'use client';

import { entrar } from '@actions/login';
import { Alert, Button, Card, Form, Input } from 'antd';
import { useState } from 'react';

export default function Login() {
    const [erro, setErro] = useState('');

    return (
        <Card title="Sistema - Login" style={{ maxWidth: 420, margin: '80px auto' }}>
            <Form
                layout="vertical"
                onFinish={async (dados) => {
                    const resposta = await entrar(dados);
                    setErro(resposta?.erro || '');
                }}
            >
                {erro ? (
                    <Form.Item>
                        <Alert type="error" message={erro} showIcon />
                    </Form.Item>
                ) : null}

                <Form.Item name="nome" label="Usuário" rules={[{ required: true }]}>
                    <Input />
                </Form.Item>

                <Form.Item name="senha" label="Senha" rules={[{ required: true }]}>
                    <Input.Password />
                </Form.Item>

                <Button type="primary" htmlType="submit" block>
                    Entrar
                </Button>
            </Form>
        </Card>
    );
}
